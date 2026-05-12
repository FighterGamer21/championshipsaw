import { useRole } from "@/hooks/use-role";

export function useAdmin() {
  const { loading, userId, isAdmin } = useRole();
  return { loading, userId, isAdmin };
}
