# /map-3d-guide-c 图形化园林编辑器使用说明

## 1. 打开方式

普通展示页：

```text
/map-3d-guide-c
```

园林编辑模式：

```text
/map-3d-guide-c?debugGarden=1
```

只有带 `debugGarden=1` 时才显示图形化园林编辑器。普通游客页面不会显示编辑面板。

## 2. 编辑器用途

这个编辑器用于人工校准 `/map-3d-guide-c` 的 3D 树群、灌木、山石等园林资产。

核心用途：

- 画出可以放树的 vegetation zone。
- 画出禁止放树的 keepout zone。
- 在可放树区域内生成预览点。
- 将预览点应用为真实 GLB 树群。
- 手动补充单个树、灌木或山石。
- 保存到浏览器 `localStorage`，并导出 TS 配置片段供后续固化到源码。

## 3. 推荐流程

### 第一步：先画 keepout 禁放区

选择：

```text
绘制 keepout
```

然后在地图上点击多个点，围出不应该放树的区域。建议先画：

- 金色主路线附近。
- 南门、胜境广场、九龙灌浴、佛手广场等开阔广场。
- 梵宫、五印坛城、祥符禅寺等建筑主体。
- 停车场、主道路、现代街区。
- 当前站点和重要 POI 标记周围。

画完后点击：

```text
完成多边形
```

keepout 区域会在后续生成树群时被自动避开。

### 第二步：再画 vegetation 放树区

选择：

```text
绘制 vegetation
```

然后在地图上点击多个点，围出适合放树、灌木、山石的区域。推荐画：

- 灵山大佛背后和两侧山林。
- 中轴线两侧林带。
- 祥符禅寺周边边缘绿化。
- 梵宫外围绿化。
- 五印坛城水体边缘。
- 出口附近的低密度收束绿化。

画完后点击：

```text
完成多边形
```

每个 vegetation zone 可以设置：

```text
name
kind: forest / axis_grove / water_edge / node_green
density
assetPool
asset ratios
minScale / maxScale
priority
```

## 4. 生成预览点

画好 vegetation 和 keepout 后，点击：

```text
生成预览点
```

系统会在 vegetation zone 内生成半透明预览点，并自动避开 keepout zone、主路线和站点附近。

预览点只是轻量提示，不是真正 GLB 模型。先检查：

- 有没有落在广场中心。
- 有没有压住金色路线。
- 有没有落在建筑屋顶上。
- 有没有太密或太稀。
- 大佛背后和中轴两侧是否形成林带。

## 5. 应用为 GLB 树群

预览点位置合理后，点击：

```text
应用为 GLB 树群
```

系统会把预览点转成真实 GLB 树、灌木、山石模型。

应用后检查：

- 树群是否太高。
- 是否遮住路线和站点。
- 是否像真实林带，而不是随机散点。
- 是否影响页面流畅度。

## 6. 单个资产添加

选择单个资产类型，例如：

```text
pine_cluster
mixed_grove
bamboo_grove
forest_edge
shrub_mass
rock_cluster
stone_mass
```

然后切换到“添加单个资产”模式，在地图上点击，即可添加一个单独资产。

单个资产适合：

- 补充空白区域。
- 修饰水边、建筑边缘。
- 修正自动生成不够自然的位置。

## 7. 本地保存与恢复

点击：

```text
保存到本地
```

当前 zones、keepouts、assets 和预览结果会保存到浏览器 `localStorage`。

下次打开：

```text
/map-3d-guide-c?debugGarden=1
```

会自动恢复上一次编辑状态。面板会显示当前是否正在使用 `localStorage` 草稿。

## 8. 清空草稿 / 重置默认

如果页面里有 Codex 或之前调试留下的旧 zone、旧 keepout、旧 preview 或旧模型，不需要手动打开 DevTools 删除 `localStorage`。

可使用：

```text
清空本地草稿
```

或：

```text
重置为默认航拍参考布局
```

这会清理 debugGarden 本地草稿，并恢复源码内置的默认航拍参考树群布局。

## 9. 导出最终配置

调到满意后，点击：

```text
复制 assets
复制 zones
复制 keepouts
导出完整配置
```

推荐使用：

```text
导出完整配置
```

它会复制完整的 `lingshanMap3DGardenAssets.ts` 片段，后续可以交给 Codex 固化到源码。

## 10. 注意事项

- 先画禁放区，再画放树区。
- 不要让树压住金色路线。
- 广场中心要留白。
- 建筑主体上不要放树。
- 大佛背后可以最密。
- 中轴两侧适合形成连续林带。
- 水边适合低矮灌木，不适合高树密堆。
- 生成 GLB 前先看预览点。
- 调试完成后一定要导出配置。

