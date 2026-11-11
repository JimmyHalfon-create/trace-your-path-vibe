type Reservation = { data: unknown; error: unknown };

export async function reserveRead(reserve: () => PromiseLike<Reservation>): Promise<"allowed" | "limited" | "unavailable"> {
  try {
    const { data, error } = await reserve();
    if (error || typeof data !== "boolean") return "unavailable";
    return data ? "allowed" : "limited";
  } catch {
    return "unavailable";
  }
}