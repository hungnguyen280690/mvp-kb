import { useNavigate } from "react-router-dom";

const BASE = "/pay-out-manual";

export function useAppNavigate() {
  const navigate = useNavigate();

  return {
    toHome: () => navigate(BASE),
    toCreate: () => navigate(`${BASE}/create`),
    toView: (id: string) => navigate(`${BASE}/${id}`),
    toEdit: (id: string) => navigate(`${BASE}/${id}/edit`),
    toApprove: (id: string) => navigate(`${BASE}/${id}/approve`),
    back: () => navigate(-1),
  };
}
