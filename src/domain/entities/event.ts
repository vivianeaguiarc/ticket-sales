export class Event {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly date: Date,
    public readonly location: string,
    public readonly createdAt: Date
  ) {}
}
