import { DefaultError, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export type LogoutData = {
  success: boolean;
  message?: string;
};

export interface LogoutVariables {
  // No variables needed for logout, but keeping interface for consistency
}

export const LOGOUT_MUTATION_KEY = "LOGOUT_MUTATION_KEY";

export const useLogoutMutation = <
  D extends LogoutData,
  V extends LogoutVariables
>() => {
  const navigate = useNavigate();

  return useMutation<D, DefaultError, V>({
    mutationKey: [LOGOUT_MUTATION_KEY],
    mutationFn: (variables) => {
      return fetch("/auth/logout", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      // Navigate to login page after successful logout
      navigate({
        to: "/login",
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
