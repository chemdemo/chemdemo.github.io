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

- 从master新建dev分支并切换当前工作目录到dev分支：`git branch -b dev master`

- 在dev分支进行修改并commit

- 合并分支到master：

``` bash
git checkout master
git merge dev
git branch -d dev
```
