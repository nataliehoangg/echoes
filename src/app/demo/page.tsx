import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <InteractiveNebulaShader />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-slate-100">
        <h1 className="text-4xl font-semibold md:text-5xl">Nebula Demo</h1>
        <p className="max-w-xl text-pretty text-slate-300">
          This page showcases the interactive shader background. Move your cursor to influence
          the nebula and tweak the component props to reveal different reminder states.
        </p>
      </div>
    </div>
  );
}

