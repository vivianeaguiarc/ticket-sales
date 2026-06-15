export class Customer {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly address: string,
    public readonly phone: string,
    public readonly createdAt: Date
  ) {}
}
