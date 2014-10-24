# git 常用命令使用小记


### basic

- git init：初始化项目

- git add [file]：向本地仓库添加文件

- git commit：提交修改到本地仓库

- git push [remote name]/[branch name]：向远程仓库提交代码`git push team/proj1`

- git status：查看本地仓库状态

- git diff：对比，查看修改

- git checkout：迁出分支或者path到工作分支

- git merge：合并分支


### branch

- 查看分支：`git branch`

- 查看所有的分支（远程分支会用颜色标注）：`git branch -a`

- 从master新建dev分支并切换当前工作目录到dev分支：`git branch -b dev master`

- 合并分支到master：

    ``` bash
    git checkout master
    git merge dev
    git branch -d dev
    ```

- 直接clone dev分支：`git clone -b dev <proj url>`

- 提交本地分支到upstream分支：`git push --set-upstream origin dev`

- 提交本地dev分支到远程仓库：`git push origin dev`

- 重命名分支：`git branch -m dev develop`

- 删除分支：`git branch -d <branch name>`

- 删除远程分支：`git push origin --delete <branch name>`

- 删除已被删除的远程分支对应的本地分支：`git remote prune origin`

- 跟踪分支：`git branch --set-upstream dev origin/dev`


### tag

- 列出所有tag：`git tag`

- 新建tag（打tag）：`git tag v0.1.0`

- 提交tag到远程仓库：`git push origin v0.1.0`

- 推送多个本地tag到远程：`git push --tags`

- 获取远程tag：`git fetch origin tag <tagname>`

- 删除tag：`git push -d v0.1.0`

- 删除远程tag：`git push -d origin tag <tagname>`
