export function getApiErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || "Something went wrong";
  }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e) => (typeof e === "string" ? e : e.message))
      .join(" ");
  }
  return data.message || "Something went wrong";
}
