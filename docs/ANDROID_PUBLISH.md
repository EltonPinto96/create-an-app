# 📱 KUSANGA KITADI — Guia de Publicação Android (TWA)

> **Tecnologia:** Trusted Web Activity (TWA) via Bubblewrap CLI  
> **Package ID:** `ao.kusangakitadi.app`  
> **Plataforma alvo:** Google Play Store

---

## O que é uma TWA?

Uma Trusted Web Activity transforma a tua PWA numa app Android publicável na Google Play Store. A app carrega o teu site HTTPS no Chrome sem barra de URL, como se fosse uma app nativa. É a mesma tecnologia usada pelo Twitter Lite, Starbucks e Uber.

```
Android APK → TWA Shell → Chrome Custom Tab → kusanga-kitadi.ao (PWA)
```

---

## Pré-requisitos

| Ferramenta | Versão | Instalação |
|-----------|--------|------------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| Java JDK | 17+ | [adoptium.net](https://adoptium.net) |
| Android SDK | — | Via Android Studio ou CLI tools |
| Bubblewrap CLI | Última | `npm install -g @bubblewrap/cli` |
| Google Play Console | — | [play.google.com/console](https://play.google.com/console) — conta de programador (\$25 taxa única) |

Verifica as instalações:
```bash
java -version        # Java 17+
node -v              # v20+
bubblewrap --version # 1.x
```

---

## 1. Instalar o Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

Na primeira execução, o Bubblewrap pergunta onde estão o JDK e o Android SDK. Podes aceitar os caminhos por defeito ou indicar os teus.

---

## 2. Configurar o Domínio de Produção

> **⚠️ IMPORTANTE:** Antes de fazer o build, substitui o domínio placeholder no `twa-manifest.json`.

Abre `twa-manifest.json` na raiz do projecto e substitui todas as ocorrências de:
```
eltonpinto96-create-an-app.pages.dev
```
pelo teu domínio definitivo, por exemplo:
```
kusanga-kitadi.ao
```

Campos a actualizar:
- `"host"`
- `"iconUrl"` e `"maskableIconUrl"`
- `"webManifestUrl"`
- `"fullScopeUrl"`
- `"shortcuts[].icons[].src"`

---

## 3. Inicializar o Projecto TWA (Opcional — já tens o `twa-manifest.json`)

Se quiseres partir do zero com o Bubblewrap (alternativa a usar o `twa-manifest.json` já configurado):

```bash
cd "c:\Users\Yewhing\Desktop\ATM KOTA\create-an-app"
bubblewrap init --manifest=https://teu-dominio.pages.dev/manifest.json
```

O Bubblewrap lê o teu `manifest.json` público e gera o `twa-manifest.json` automaticamente. Depois podes editar conforme necessário.

---

## 4. Gerar o Keystore de Assinatura (UMA VEZ APENAS)

O keystore é o certificado que assina o teu APK. **Guarda-o em local seguro** — sem ele não podes actualizar a app na Play Store.

```bash
keytool -genkey -v \
  -keystore android.keystore \
  -alias kusanga-kitadi \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Responde às perguntas (nome, organização, etc.). Guarda as passwords em local seguro.

> 🔒 **Segurança:** O ficheiro `android.keystore` **nunca** deve ser commitado no Git. O `.gitignore` já o exclui.

---

## 5. Obter o SHA-256 do Keystore (Para o `assetlinks.json`)

```bash
keytool -list -v \
  -keystore android.keystore \
  -alias kusanga-kitadi
```

Copia o valor **SHA256** que aparece na saída (formato: `AA:BB:CC:...`).

Abre `public/.well-known/assetlinks.json` e substitui:
```json
"SUBSTITUIR_COM_SHA256_DO_KEYSTORE"
```
pelo valor real, por exemplo:
```json
"AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78"
```

Faz commit e push deste ficheiro. O Cloudflare irá servi-lo em:
```
https://teu-dominio.ao/.well-known/assetlinks.json
```

---

## 6. Validar os Digital Asset Links

Antes de fazer o build, verifica que o `assetlinks.json` está a ser servido correctamente:

```bash
curl https://teu-dominio.ao/.well-known/assetlinks.json
```

Podes também usar a [ferramenta de validação da Google](https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://teu-dominio.ao&relation=delegate_permission/common.handle_all_urls).

---

## 7. Build do APK / AAB

```bash
cd "c:\Users\Yewhing\Desktop\ATM KOTA\create-an-app"
bubblewrap build
```

O Bubblewrap irá pedir:
- Password do keystore
- Password da chave (alias)

Gera dois ficheiros:
- `app-release-signed.apk` — para instalar directamente em dispositivos Android para testes
- `app-release-bundle.aab` — formato requerido pela Google Play Store

---

## 8. Testar o APK num Dispositivo Android

```bash
# Instalar via ADB (Android Debug Bridge)
adb install app-release-signed.apk
```

Ou transfere o `.apk` para o dispositivo e instala manualmente (ativa "Origens desconhecidas" nas Definições).

**O que verificar:**
- [ ] A app abre sem barra de URL do Chrome (modo TWA activo)
- [ ] Login com Google funciona
- [ ] Mapa carrega correctamente
- [ ] Funciona em modo offline (service worker)
- [ ] Ícone aparece correctamente na homescreen

---

## 9. Verificação TWA (Chrome sem URL bar)

Se a app mostrar a barra de URL do Chrome, o `assetlinks.json` não está correcto. Verifica:
1. O ficheiro está acessível publicamente em `/.well-known/assetlinks.json`
2. O `package_name` corresponde exactamente ao `packageId` no `twa-manifest.json`
3. O SHA-256 corresponde ao keystore usado para assinar o APK

---

## 10. Publicar na Google Play Store

### 10.1 Criar a App na Play Console

1. Acede ao [Google Play Console](https://play.google.com/console).
2. Clica em **Criar app**.
3. Preenche:
   - Nome: `Kusanga Kitadi`
   - Língua padrão: `Português (Angola)`
   - Tipo: `App`
   - Gratuita/Paga: `Gratuita`
4. Aceita as políticas do programa.

### 10.2 Preencher os Metadados

| Campo | Valor |
|-------|-------|
| Título | Kusanga Kitadi |
| Resumo curto | Saiba onde levantar em Luanda |
| Descrição completa | *Ver abaixo* |
| Categoria | Finanças |
| E-mail de contacto | privacidade@kusanga-kitadi.ao |
| Política de Privacidade | URL do teu site (rota `/privacidade` ou modal) |

**Descrição sugerida para a Play Store:**
```
Kusanga Kitadi é a plataforma comunitária angolana de localização de caixas 
automáticos (ATM) em Luanda. Consulta reportes em tempo real de outros 
utilizadores sobre disponibilidade de dinheiro, estado dos terminais e tempo 
de fila.

A força está na ligação. Saiba onde levantar.

✓ Mapa interactivo de ATM em Luanda
✓ Reportes comunitários em tempo real
✓ Favoritos e notificações de mudança de estado
✓ Funciona offline
✓ 100% gratuito, sem publicidade
```

### 10.3 Upload do AAB

1. No Play Console → **Versão** → **Teste interno** (começa aqui para testes).
2. Clica em **Criar nova versão**.
3. Faz upload do `app-release-bundle.aab`.
4. Preenche as notas de versão em português.
5. Clica em **Guardar** → **Rever versão** → **Lançar para Teste Interno**.

### 10.4 Publicação Completa

Depois de testes internos, promove para:
- **Teste fechado (alfa):** 30-50 utilizadores convidados (Fase 8 do projecto)
- **Teste aberto (beta):** Sem limite de utilizadores
- **Produção:** Lançamento público

---

## 11. Actualizar a App (Versões Futuras)

Para cada actualização:
1. Incrementa `appVersionCode` (ex: `2`) e `appVersionName` (ex: `1.1.0`) no `twa-manifest.json`.
2. Faz `bubblewrap build` novamente com o mesmo keystore.
3. Faz upload do novo `.aab` na Play Console.

---

## 12. Checklist Completa Pré-Lançamento

```
[ ] Domínio de produção activo com HTTPS (Cloudflare)
[ ] assetlinks.json com SHA-256 real e acessível publicamente
[ ] twa-manifest.json com domínio e packageId correctos
[ ] APK testado em dispositivo físico Android (Chrome 72+)
[ ] TWA activo sem barra de URL
[ ] Login Google funcional na app
[ ] Offline mode funcional
[ ] Capturas de ecrã para a Play Store (mínimo 2 telemóvel)
[ ] Ícone 512x512 PNG enviado para a Play Console
[ ] Política de Privacidade acessível publicamente
[ ] Conta Google Play Console criada e paga ($25)
[ ] Descrição em português de Angola preenchida
[ ] App submetida para revisão (3-7 dias)
```

---

*Documento gerado para o projecto KUSANGA KITADI — Luanda, Angola.*  
*"A força está na ligação. Saiba onde levantar."*
