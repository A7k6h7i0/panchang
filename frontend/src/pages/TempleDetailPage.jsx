import ServiceDetailPage from "./ServiceDetailPage";
import { useParams } from "react-router-dom";

export default function TempleDetailPage() {
  const params = useParams();
  return (
    <ServiceDetailPage
      key={params.serviceId || params.itemId}
      serviceType="temple"
      pageTitle="Temple"
      backTo="/temples"
      backLabel="Back to Temples"
      showHeaderAddress={false}
      showDirections={false}
    />
  );
}
