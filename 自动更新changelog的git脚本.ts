Bonne idée — mais je te recommande de ne pas toucher directement au README à chaque MR. La pratique standard est d’écrire dans un CHANGELOG.md (généré automatiquement) et de lier ce changelog depuis le README. Techniquement, tu peux écrire dans le README, mais ça complique la vie (boucles CI infinies, conflits fréquents).

Ci-dessous, deux approches éprouvées (tu peux en choisir une) + un exemple clé-en-main.

Option A (recommandée) — Générer un CHANGELOG à chaque merge sur la branche par défaut

Principe :

Un job GitLab CI se déclenche uniquement quand main (ou master) reçoit un merge.

Il calcule les commits depuis le dernier tag (ou depuis la dernière mise à jour), met à jour CHANGELOG.md, commit/push le fichier, avec un message contenant [skip ci] pour éviter une boucle.

Le README a juste un lien « Voir le changelog ».

Pré-requis

Créer un PAT (Personal Access Token) ou activer « Allow pipeline to write to repository » et stocker le token dans Settings > CI/CD > Variables

Variable recommandée : GIT_WRITE_TOKEN (masked, protected).

Autoriser le job à pousser : soit via PAT (le plus simple), soit via CI_JOB_TOKEN + règle de projet autorisant l’écriture via l’API.

.gitlab-ci.yml minimal
stages: [changelog]

generate_changelog:
  stage: changelog
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'   # seulement sur la branche par défaut (post-merge)
  image: alpine:3.20
  before_script:
    - apk add --no-cache git
    - git config user.name "ci-bot"
    - git config user.email "ci-bot@example.com"
    - git fetch --tags origin
  script: |
    # 1) Déterminer la base de comparaison (dernier tag, sinon le commit initial)
    PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
    if [ -z "$PREV_TAG" ]; then
      BASE=$(git rev-list --max-parents=0 HEAD)
    else
      BASE="$PREV_TAG"
    fi

    # 2) Générer les notes depuis BASE jusqu'à HEAD
    echo "## $(date +%Y-%m-%d) — $(git rev-parse --short HEAD)" > .tmp_release_notes.md
    echo "" >> .tmp_release_notes.md
    # Exemple : utiliser le sujet des commits; adapte selon ton format (Conventional Commits, etc.)
    git log --pretty=format:"- %s (%h)" "$BASE"..HEAD >> .tmp_release_notes.md
    echo "" >> .tmp_release_notes.md

    # 3) Insérer en tête de CHANGELOG.md
    if [ -f CHANGELOG.md ]; then
      cat .tmp_release_notes.md CHANGELOG.md > CHANGELOG.new.md
      mv CHANGELOG.new.md CHANGELOG.md
    else
      mv .tmp_release_notes.md CHANGELOG.md
    fi

    # 4) Commit & push (éviter la boucle CI avec [skip ci])
    git add CHANGELOG.md
    if ! git diff --cached --quiet; then
      # remote avec PAT
      git remote set-url origin "https://oauth2:${GIT_WRITE_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git"
      git commit -m "chore(changelog): update [skip ci]"
      git push origin "$CI_COMMIT_BRANCH"
    else
      echo "No changes to CHANGELOG.md"
    fi

README (extrait)
# Mon Projet

… (présentation)

➡️ Consultez l’historique des changements : [CHANGELOG.md](./CHANGELOG.md)


Avantages :

Zéro friction côté développeurs.

Pas de conflits sur README.

Facile à faire évoluer (tu peux passer à Conventional Commits + semantic-release quand tu veux).

Option B — Mettre à jour directement le README après chaque merge

Si tu veux vraiment écrire dans le README :

Même principe que ci-dessus, mais tu modifies une section dédiée du README (ex. <!-- CHANGELOG:START --> / <!-- CHANGELOG:END -->) à chaque merge sur main.

Tu conserves [skip ci] dans le commit du bot.

Tu limites la taille (p.ex. derniers 10 messages) pour éviter un README gigantesque.

Exemple de script (remplace CHANGELOG.md par mise à jour du README)

Ajoute dans le job ci-dessus, à la place de l’étape 3) :

# README update entre deux marqueurs
START="<!-- CHANGELOG:START -->"
END="<!-- CHANGELOG:END -->"

# Génère le bloc
BLOCK=$(printf "%s\n\n" "### Derniers changements ($(date +%Y-%m-%d))" ; \
        git log --pretty=format:"- %s (%h)" "$BASE"..HEAD)

# Construit le nouveau README
awk -v start="$START" -v end="$END" -v block="$BLOCK" '
  BEGIN { inblock=0 }
  $0 ~ start { print; print ""; print block; inblock=1; next }
  $0 ~ end { inblock=0 }
  !inblock { print }
' README.md > README.new.md

mv README.new.md README.md


Et dans ton README.md, ajoute une zone :

## Journal des modifications

<!-- CHANGELOG:START -->
(Auto-généré par la CI)
<!-- CHANGELOG:END -->


Points d’attention (Option B) :

Risque de conflits si quelqu’un édite manuellement la zone.

Boucles CI si tu oublies [skip ci] ou une règle rules: pour ignorer les commits ci-bot.

Taille du README : limite le nombre d’entrées.

Option C — Webhook externe (plus flexible)

Créer un webhook GitLab sur l’événement “Merge request events (merge)”.

Ton petit service (Cloud Run, Lambda, etc.) récupère la liste des commits via l’API GitLab et ouvre un commit (ou une MR) mettant à jour CHANGELOG.md/README.

Tu contrôles mieux le format et tu peux, par exemple, regrouper par scope (Conventional Commits) ou ignorer les commits chore:.

Bonnes pratiques complémentaires

Conventional Commits (feat:, fix:, etc.) → changelog propre.

Squash & merge → un seul message par MR (plus lisible).

Tags de release → pour calculer facilement la plage last_tag..HEAD.

Évite le README pour un historique détaillé : garde un CHANGELOG.md et mets un résumé ou un lien dans le README.

Réponse à ta question

“Est-ce que je peux simplement écrire un script dans les codes source du projet pour déclencher ce processus à chaque MR ?”
Techniquement oui, via GitLab CI (Option A/B) ou un webhook (Option C). Le plus simple et solide : un job CI qui tourne après merge sur la branche par défaut et met à jour CHANGELOG.md, puis un lien dans le README.

Si tu veux, je te génère un .gitlab-ci.yml prêt à coller pour :

CHANGELOG.md (Option A), ou

Mise à jour d’une section du README (Option B).

Vous avez dit :
好的。现在把你的回答用中文向我重复一遍.
ChatGPT a dit :

好的 👍，我把上面的内容完整地翻译并整理成中文版本给你：

核心思路

你的想法是 在 GitLab 上每次 MR 合并后，自动把 commit 信息写进 README。
技术上可行，但我建议的最佳实践是：

👉 不要直接写进 README，而是自动生成一个 CHANGELOG.md 文件（更新日志），然后在 README 里加一个链接指向它。
这样可以避免冲突、循环 CI、README 变得很长。

方案 A（推荐）—— 每次 MR 合并到主分支时自动生成 CHANGELOG

流程：

只在 main（或 master）分支合并后触发 GitLab CI 任务。

自动收集合并以来的 commit 信息，写入/更新 CHANGELOG.md。

CI 脚本自动提交 CHANGELOG.md，带 [skip ci] 防止无限循环。

README 里只放一句话链接过去。

需要准备

在 GitLab 上配置 CI/CD 变量，例如 GIT_WRITE_TOKEN（Personal Access Token 或者启用 Job Token 写权限）。

在 .gitlab-ci.yml 里写一个 generate_changelog job。

.gitlab-ci.yml 示例
stages: [changelog]

generate_changelog:
  stage: changelog
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
  image: alpine:3.20
  before_script:
    - apk add --no-cache git
    - git config user.name "ci-bot"
    - git config user.email "ci-bot@example.com"
    - git fetch --tags origin
  script: |
    # 找到上一个 tag（如果没有就用项目的第一个 commit）
    PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
    if [ -z "$PREV_TAG" ]; then
      BASE=$(git rev-list --max-parents=0 HEAD)
    else
      BASE="$PREV_TAG"
    fi

    # 生成 changelog 片段
    echo "## $(date +%Y-%m-%d) — $(git rev-parse --short HEAD)" > .tmp_release_notes.md
    echo "" >> .tmp_release_notes.md
    git log --pretty=format:"- %s (%h)" "$BASE"..HEAD >> .tmp_release_notes.md
    echo "" >> .tmp_release_notes.md

    # 插入到 CHANGELOG.md
    if [ -f CHANGELOG.md ]; then
      cat .tmp_release_notes.md CHANGELOG.md > CHANGELOG.new.md
      mv CHANGELOG.new.md CHANGELOG.md
    else
      mv .tmp_release_notes.md CHANGELOG.md
    fi

    # 提交并 push
    git add CHANGELOG.md
    if ! git diff --cached --quiet; then
      git remote set-url origin "https://oauth2:${GIT_WRITE_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git"
      git commit -m "chore(changelog): update [skip ci]"
      git push origin "$CI_COMMIT_BRANCH"
    else
      echo "没有变化"
    fi

README 示例
# 我的项目

👉 [查看更新日志](./CHANGELOG.md)


好处：

不会和开发者手动改 README 冲突。

CI 脚本简单。

后续可以升级成 semantic-release，做更智能的版本管理。

方案 B —— 直接更新 README

如果你坚持要把日志写进 README，可以这样做：

在 README 里留一个区域：

## 更新日志
<!-- CHANGELOG:START -->
（自动生成）
<!-- CHANGELOG:END -->


在 CI job 里，每次合并后生成 commit 列表，替换掉这两个标记之间的内容。

脚本片段
START="<!-- CHANGELOG:START -->"
END="<!-- CHANGELOG:END -->"

BLOCK=$(printf "%s\n\n" "### 最新更新 ($(date +%Y-%m-%d))" ; \
        git log --pretty=format:"- %s (%h)" "$BASE"..HEAD)

awk -v start="$START" -v end="$END" -v block="$BLOCK" '
  BEGIN { inblock=0 }
  $0 ~ start { print; print ""; print block; inblock=1; next }
  $0 ~ end { inblock=0 }
  !inblock { print }
' README.md > README.new.md

mv README.new.md README.md


⚠️ 注意事项：

如果有人手动编辑这部分内容，可能会冲突。

必须在 CI 提交信息里加 [skip ci]，否则会进入无限循环。

README 会越来越长，建议只显示最近 5~10 条。

方案 C —— 外部 Webhook

另一种办法是：

在 GitLab 项目里设置 Merge request event webhook。

webhook 服务（比如一个 Lambda 或者小的 Node.js 服务）收到事件后：

调用 GitLab API 拿到这次 MR 的 commit 信息；

自动在仓库里新建 commit 或 MR，更新 CHANGELOG.md 或 README。

这种方式更灵活，可以分组、过滤（比如只要 feat:、fix:）。

总结

你问的：

我能不能直接写个脚本放在项目里，每次 MR 都触发？

✅ 可以。方法是通过 GitLab CI job 或者 webhook。
但最佳实践是 —— 更新 CHANGELOG.md，然后在 README 链接它，而不是把所有 commit 文本写进 README。

要不要我帮你直接写一个 现成可用的 .gitlab-ci.yml，分别适用于 方案 A（CHANGELOG.md） 和 方案 B（README 更新）？
