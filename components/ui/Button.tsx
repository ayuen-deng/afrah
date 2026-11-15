import { LoadingButton, type LoadingButtonProps } from "@/components/ui/LoadingButton";

export type ButtonProps = LoadingButtonProps;

export function Button(props: ButtonProps) {
  return <LoadingButton {...props} />;
}

