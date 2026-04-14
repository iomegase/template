# Template MCP Server

Serveur MCP local pour piloter le projet `template` avec des outils contrôlés.

## Installation

Depuis la racine du repo :

```bash
cd mcp-server
npm install
```

## Démarrage en développement

```bash
npm run dev
```

Le serveur utilise le transport `stdio`. Il doit donc être lancé par un client MCP compatible.

## Test avec MCP Inspector

```bash
npm run inspect
```

## Build

```bash
npm run build
npm start
```

## Outils disponibles

### `read_project_tree`

Lit l'arborescence du projet.

Paramètres :

```json
{
  "path": ".",
  "depth": 3
}
```

### `read_file`

Lit le contenu d'un fichier du projet.

Paramètres :

```json
{
  "path": "src/app/page.tsx"
}
```

### `generate_crud_module`

Prépare ou crée un module CRUD minimal.

Par défaut, `dryRun` vaut `true`, donc aucun fichier n'est créé.

```json
{
  "name": "products",
  "label": "Produits",
  "dryRun": true
}
```

Pour créer réellement les fichiers :

```json
{
  "name": "products",
  "label": "Produits",
  "dryRun": false
}
```

Fichiers générés :

```txt
src/app/admin/products/page.tsx
src/components/products/ProductsForm.tsx
src/lib/validations/products.ts
```

## Configuration client MCP

Exemple générique :

```json
{
  "mcpServers": {
    "template-mcp-server": {
      "command": "node",
      "args": ["/chemin/absolu/template/mcp-server/dist/index.js"]
    }
  }
}
```

En développement :

```json
{
  "mcpServers": {
    "template-mcp-server": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/chemin/absolu/template/mcp-server"
    }
  }
}
```
