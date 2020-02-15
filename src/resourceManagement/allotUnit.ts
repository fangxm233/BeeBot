export class AllotUnit implements protoAllotUnit{
	public available: boolean;
	public roomName: string;
	public typeId: number;
	public id: number;
	public data: any;
    
    constructor(roomName: string, data: any){
        this.roomName = roomName;
        this.data = data;
    }
}