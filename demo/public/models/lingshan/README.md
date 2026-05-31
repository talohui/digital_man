# 灵山 3D 模型目录说明

此目录用于存放后续灵山胜境 GLB / glTF 模型资源。

建议目录结构：

- `landmarks/lingshan_buddha.glb`
- `landmarks/fan_gong.glb`
- `landmarks/jiulong_guanyu.glb`
- `landmarks/wuyin_tancheng.glb`

提交要求：

- 不提交大体积未压缩模型。
- 模型应控制面数和贴图体积。
- 推荐统一模型原点、比例和朝向。
- 模型文件确认存在后，再在 `src/data/scenic3d/lingshanAssetMap.ts` 中填写对应 `modelUrl`。
- 大型原始工程文件、未压缩贴图和临时导出文件不应提交到仓库。
