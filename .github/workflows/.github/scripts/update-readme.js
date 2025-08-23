import fs from "node:fs";
import fetch from "node-fetch";

const USER = process.env.GITHUB_USER;
const TOKEN = process.env.GITHUB_TOKEN;

async function getRepos() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "X-GitHub-Api-Version": "2022-11-28" }
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  // Filtra e organiza: mostra seus principais (full stack + testes e automação)
  const keywords = [/auto.?shop/i, /conecta.?vagas/i, /deyyy?more/i, /teste|autom(a|á)??o|selenium|nunit|junit/i];
  const featured = data.filter(r => keywords.some(rx => rx.test(r.name) || rx.test(r.description || "")));

  // fallback se não achar nada por keyword
  const list = (featured.length ? featured : data).slice(0, 8);

  return list.map(r => `- [${r.name}](${r.html_url}) — ⭐ ${r.stargazers_count} • Último push: ${new Date(r.pushed_at).toLocaleDateString("pt-BR")}  
  ${r.description ? "  <br/>" + r.description : ""}`).join("\n");
}

function inject(content, start, end, newBlock) {
  const rx = new RegExp(`(${start})([\\s\\S]*?)(${end})`, "m");
  return content.replace(rx, `$1\n${newBlock}\n$3`);
}

(async () => {
  const mdPath = "README.md";
  const md = fs.readFileSync(mdPath, "utf8");
  const reposList = await getRepos();

  const updated = inject(md, "<!--START:REPOS-->", "<!--END:REPOS-->", reposList);

  if (updated !== md) fs.writeFileSync(mdPath, updated);
})();
