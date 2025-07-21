import { DefaultError, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export type LogoutData = {
  success: boolean;
  message?: string;
};

export const LOGOUT_MUTATION_KEY = "LOGOUT_MUTATION_KEY";

export const useLogoutMutation = () => {
  const navigate = useNavigate();

  return useMutation<LogoutData, DefaultError>({
    mutationKey: [LOGOUT_MUTATION_KEY],
    mutationFn: () => {
      return fetch("/auth/logout", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      // Navigate to login page after successful logout
      navigate({
        to: "/an-unexcluded-pattern",
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};
