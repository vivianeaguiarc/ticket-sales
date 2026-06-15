export class Partner {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly companyName: string,
    public readonly createdAt: Date
  ) {}
}
