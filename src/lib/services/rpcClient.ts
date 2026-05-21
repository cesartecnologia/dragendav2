export const callDataService = async <TResult>(
  resource: string,
  action: string,
  args: unknown[],
): Promise<TResult> => {
  const response = await fetch("/api/data", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resource, action, args }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(
      (): { message: string } => ({ message: "Erro ao carregar dados" }),
    )) as Partial<{ message: string }>;
    throw new Error(payload.message ?? "Erro ao carregar dados");
  }

  const payload = (await response.json()) as { result: TResult };
  return payload.result;
};
