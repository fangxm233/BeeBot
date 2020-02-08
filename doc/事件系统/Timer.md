# Timer
## 简介
在指定时间用指定this触发回调，在全局重置时清空，需要重新添加。
## 添加一个回调
使用以下方法添加回调，参数为`this`，目标tick和回调函数
```js
Timer.callBackAtTick(funcThis, targetTick, func)
```