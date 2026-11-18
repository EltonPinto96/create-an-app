import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Fase 7 — Configuração Android TWA e Digital Asset Links", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("valida a existência e integridade do twa-manifest.json", () => {
    const twaPath = path.join(rootDir, "twa-manifest.json");
    expect(fs.existsSync(twaPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(twaPath, "utf-8"));
    expect(content.packageId).toBe("ao.kusangakitadi.app");
    expect(content.launcherName).toBe("Kusanga Kitadi");
    expect(content.themeColor).toBe("#26362F");
    expect(content.backgroundColor).toBe("#F7F4EC");
    expect(content.display).toBe("standalone");
    expect(content.enableNotifications).toBe(true);
    expect(content.signingKey).toBeDefined();
    expect(content.signingKey.alias).toBe("kusanga-kitadi");
    expect(Array.isArray(content.shortcuts)).toBe(true);
    expect(content.shortcuts.length).toBeGreaterThanOrEqual(2);
  });

  it("valida a configuração do Digital Asset Links (.well-known/assetlinks.json)", () => {
    const assetlinksPath = path.join(rootDir, "public", ".well-known", "assetlinks.json");
    expect(fs.existsSync(assetlinksPath)).toBe(true);

    const assetlinks = JSON.parse(fs.readFileSync(assetlinksPath, "utf-8"));
    expect(Array.isArray(assetlinks)).toBe(true);
    expect(assetlinks.length).toBeGreaterThan(0);

    const statement = assetlinks[0];
    expect(statement.relation).toContain("delegate_permission/common.handle_all_urls");
    expect(statement.target.namespace).toBe("android_app");
    expect(statement.target.package_name).toBe("ao.kusangakitadi.app");
    expect(Array.isArray(statement.target.sha256_cert_fingerprints)).toBe(true);
  });

  it("valida a presença dos ícones rasterizados PNG em public/icons/", () => {
    const iconsDir = path.join(rootDir, "public", "icons");
    expect(fs.existsSync(iconsDir)).toBe(true);

    const expectedIcons = [
      "icon-192.png",
      "icon-512.png",
      "icon-maskable-192.png",
      "icon-maskable-512.png",
    ];

    for (const iconName of expectedIcons) {
      const iconPath = path.join(iconsDir, iconName);
      expect(fs.existsSync(iconPath)).toBe(true);
      const stat = fs.statSync(iconPath);
      expect(stat.size).toBeGreaterThan(100); // Garante que não está vazio
    }
  });

  it("valida a sincronização de ícones no public/manifest.json", () => {
    const manifestPath = path.join(rootDir, "public", "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);

    const iconSrcs = manifest.icons.map((i: { src: string }) => i.src);
    expect(iconSrcs).toContain("/icons/icon-192.png");
    expect(iconSrcs).toContain("/icons/icon-512.png");
    expect(iconSrcs).toContain("/icons/icon-maskable-192.png");
    expect(iconSrcs).toContain("/icons/icon-maskable-512.png");
  });

  it("assegura que ficheiros de keystore sensíveis são ignorados pelo git", () => {
    const gitignorePath = path.join(rootDir, ".gitignore");
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    expect(gitignore).toMatch(/\*\.keystore/);
    expect(gitignore).toMatch(/\*\.jks/);
  });

  it("valida que o guia de publicação Android existe e cobre as secções obrigatórias", () => {
    const guidePath = path.join(rootDir, "docs", "ANDROID_PUBLISH.md");
    expect(fs.existsSync(guidePath)).toBe(true);

    const guide = fs.readFileSync(guidePath, "utf-8");
    expect(guide).toMatch(/bubblewrap build/i);
    expect(guide).toMatch(/keytool/i);
    expect(guide).toMatch(/assetlinks\.json/i);
    expect(guide).toMatch(/ao\.kusangakitadi\.app/i);
    expect(guide).toMatch(/Google Play/i);
  });
});
