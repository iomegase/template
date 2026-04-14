import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { PROJECT_ROOT, resolveProjectPath, toProjectRelativePath } from "../utils/safe-path.js";

export const generateCrudModuleSchema = {
  name: z.string().min(2).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
  label: z.string().min(2).optional(),
  dryRun: z.boolean().default(true),
};

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toPascalCase(value: string): string {
  return toKebabCase(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

type PlannedFile = {
  path: string;
  content: string;
};

function buildCrudFiles(input: { name: string; label?: string }): PlannedFile[] {
  const kebabName = toKebabCase(input.name);
  const pascalName = toPascalCase(input.name);
  const label = input.label ?? pascalName;

  return [
    {
      path: `src/app/admin/${kebabName}/page.tsx`,
      content: `export default function ${pascalName}AdminPage() {\n  return (\n    <main className=\"space-y-6 p-6\">\n      <div>\n        <p className=\"text-sm text-muted-foreground\">Module CRUD</p>\n        <h1 className=\"text-2xl font-semibold\">${label}</h1>\n      </div>\n\n      <p className=\"text-muted-foreground\">Liste des éléments ${label} à connecter à la base de données.</p>\n    </main>\n  );\n}\n`,
    },
    {
      path: `src/components/${kebabName}/${pascalName}Form.tsx`,
      content: `type ${pascalName}FormProps = {\n  defaultValues?: {\n    name?: string;\n  };\n};\n\nexport function ${pascalName}Form({ defaultValues }: ${pascalName}FormProps) {\n  return (\n    <form className=\"space-y-4\">\n      <div className=\"space-y-2\">\n        <label className=\"text-sm font-medium\" htmlFor=\"name\">Nom</label>\n        <input\n          id=\"name\"\n          name=\"name\"\n          defaultValue={defaultValues?.name}\n          className=\"h-10 w-full rounded-md border px-3\"\n        />\n      </div>\n    </form>\n  );\n}\n`,
    },
    {
      path: `src/lib/validations/${kebabName}.ts`,
      content: `import { z } from \"zod\";\n\nexport const ${pascalName}Schema = z.object({\n  name: z.string().min(2, \"Le nom est obligatoire\"),\n});\n\nexport type ${pascalName}Input = z.infer<typeof ${pascalName}Schema>;\n`,
    },
  ];
}

export async function generateCrudModule(input: {
  name: string;
  label?: string;
  dryRun: boolean;
}) {
  const files = buildCrudFiles(input);

  if (!input.dryRun) {
    for (const file of files) {
      const absolutePath = resolveProjectPath(file.path);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, file.content, "utf8");
    }
  }

  const result = {
    dryRun: input.dryRun,
    projectRoot: PROJECT_ROOT,
    files: files.map((file) => ({
      path: toProjectRelativePath(resolveProjectPath(file.path)),
      status: input.dryRun ? "planned" : "created",
    })),
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
