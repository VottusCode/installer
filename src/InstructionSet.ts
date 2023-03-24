import { InstructionSetName } from "./types";

export class InstructionSet<TName extends InstructionSetName = InstructionSetName> {
    private children: InstructionSet[] = [];

    private shouldUpdate: boolean = false;

    constructor(
        private name: TName,
        private architectures: string[] = [],
        private beforePackagesCmds: string[] = [],
        private gpgKeys: Record<string, string>[] = [],
        private aptLists: Record<string, string[]> = {},
        private ppas: string[] = [],
        private packages: string[] = [],
        private cmds: string[] = [],
        private debs: string[] = []
    ) {}

    _debugTree(): object {
        return {
            name: this.name,
            architectures: this.architectures,
            beforePackagesCmds: this.beforePackagesCmds,
            gpgKeys: this.gpgKeys,
            aptLists: this.aptLists,
            ppas: this.ppas,
            packages: this.packages,
            cmds: this.cmds,
            debs: this.debs,
            children: this.children.map((c) => c?._debugTree()),
        };
    }

    private _val<T>(arr: T | T[]): T[] {
        return !Array.isArray(arr) ? [arr] : arr;
    }

    getSetName(): TName {
        return this.name;
    }

    toString(): TName {
        return this.name;
    }

    forceUpdate(): InstructionSet {
        this.shouldUpdate = true;
        return this;
    }

    addChildSet(child: InstructionSet): InstructionSet {
        if (this.children.some((c) => c?.getSetName() === child.getSetName())) {
            throw new Error(`Child with name ${child.getSetName()} already exists!`);
        }
        this.children.push(child);
        return this;
    }

    removeChildSet(child: InstructionSet | string): InstructionSet {
        this.children = this.children.filter((c) => c?.getSetName() !== String(child));
        return this;
    }

    arch(arch: string | string[]): InstructionSet {
        this.architectures = this.architectures.concat(this._val(arch));
        this.forceUpdate();
        return this;
    }

    execBefore(cmd: string | string[]): InstructionSet {
        this.beforePackagesCmds = this.beforePackagesCmds.concat(this._val(cmd));
        this.forceUpdate();
        return this;
    }

    keychain(name: string, key: string): InstructionSet {
        this.gpgKeys[name] = key;
        this.forceUpdate();
        return this;
    }

    sourceList(name: string, debs: string[]): InstructionSet {
        this.aptLists[name] = debs;
        this.forceUpdate();
        return this;
    }

    ppa(ppa: string | string[]): InstructionSet {
        this.ppas = this.ppas.concat(this._val(ppa));
        this.forceUpdate();
        return this;
    }

    package(pkg: string | string[]): InstructionSet {
        this.packages = this.packages.concat(this._val(pkg));
        return this;
    }

    cmd(cmd: string | string[]): InstructionSet {
        this.cmds = this.cmds.concat(this._val(cmd));
        return this;
    }

    deb(debs: string | string[]): InstructionSet {
        this.debs = this.debs.concat(this._val(debs));
        return this;
    }

    buildToString(): string {
        return ([] as string[]).concat(
            ...Object.keys(this.aptLists).map(k => [
                ...this.aptLists[k].map(deb => `echo "${deb}" | tee /etc/apt/sources.list.d/${k}`)
            ]),
            ...Object.keys(this.gpgKeys).map((i) => [
                `wget -qO- ${this.gpgKeys[i]} | gpg --dearmor --yes > /tmp/liliana--${i}`,
                `install -D -o root -g root -m 644 /tmp/liliana--${i} /etc/apt/keyrings/${i}`,
            ]),
            this.architectures.map((arch) => `dpkg --add-architecture ${arch}`),
            ...this.debs.map((deb, i) => [`wget -O /tmp/liliana--deb-${i}.deb ${deb}`, `gdebi /tmp/liliana--deb-${i}.deb`]),
            this.beforePackagesCmds,
            this.ppas.map((ppa) => `add-apt-repository ppa:${ppa}`),
            ...this.shouldUpdate ? ['apt updater'] : [],
            this.packages.length >= 1 ? [`apt install -y ${this.packages.join(" ")}`] : [],
            this.cmds,
            this.children.map(c => c.buildToString())
        ).join("\n");
    }
}
