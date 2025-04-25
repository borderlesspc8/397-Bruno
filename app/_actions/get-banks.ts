"use server";

export async function getBanks() {
  try {
    const response = await fetch("/api/banks");

    if (!response.ok) {
      const error = await response.json();
      return { error };
    }

    const banks = await response.json();
    return { banks };
  } catch (error) {
    return { error: "Erro ao buscar bancos" };
  }
} 