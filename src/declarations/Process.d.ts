interface protoProcess {
    name: string;
    state: 'sleeping' | 'active' | 'suspended';
	slt?: number;
	bees: {[role: string]: string[] };
}

type protoProcessFilling = protoProcess & {

};

type protoProcessBoost = protoProcess & {
    type: 'single' | 'lasting';
}