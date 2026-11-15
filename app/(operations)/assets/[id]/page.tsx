import { AssetProfilePage } from "@/components/operations/AssetProfilePage";

export default function AssetProfileRoute({ params }: { params: { id: string } }) {
  return <AssetProfilePage assetId={params.id} />;
}
