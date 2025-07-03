gh コマンドを使って、シーケンシャルな pull request を順番に最新の状態にするツールを作ろうと思っています。


例えば、dev というベースブランチがあって、dev ← feature-1, feature-1 ← feature-2 という pull request があるとすると、
`gh-propagate dev feature-2` というコマンドを実行すると、
- gh command を使い、feature-2 の target branch (feature-1) を見つける
- gh command を使い、feature-1 の target branch (dev) を見つける
- dev になったので停止
- 今後は逆順で、dev を最新の状態にし(git switch dev, git pull)、feature-1 にマージする (git switch feature-1, git pull, git merge --no-ff dev)
- feature-1 を最新の状態にし(git switch feature-1, git pull)、feature-2 にマージする (git switch feature-2, git pull, git merge --no-ff feature-1)
- これで、xxxx dev feature-2 の feature-2 が最新になったので完了
