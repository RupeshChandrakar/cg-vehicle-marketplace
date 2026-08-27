import { brand } from '@cg/shared-config';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">{brand.name} Admin</h1>
      <p className="max-w-md text-base text-[#6B7280]">
        Admin and agent console — foundation phase.
      </p>
    </div>
  );
}
