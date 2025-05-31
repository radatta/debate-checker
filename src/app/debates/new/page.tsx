import { NewDebateForm } from "./new-debate-form";

export default function NewDebatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Debate</h1>
        <NewDebateForm />
      </div>
    </div>
  );
}
