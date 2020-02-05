# Bee设计
## 概述
Bee是一个creep的包装，负责creep的任务生成和执行，封装了creep的所有动作和属性。它作为父类派生出许多分化职能的Bee。

Bee对象可以管理多个creep，会因为creep的全部死去而销毁。Bee的数目由Process管理
## 设计细节
- 接班 当一个creep即将老死的时候申请一个新的creep，在新的到来之后替换
- 在一个creep死去但是没有接班时申请一个新的creep