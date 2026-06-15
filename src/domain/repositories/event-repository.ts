export interface EventRepository {
  findById(eventId: number): Promise<{ id: number } | null>
}
