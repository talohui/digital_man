type PreviewApplication = {
  destroy: (
    removeView: boolean,
    stageOptions: { children: boolean; texture?: boolean; baseTexture?: boolean }
  ) => void
}

export function destroyAdminLive2DPreview(app: PreviewApplication): void {
  app.destroy(false, { children: true, texture: true, baseTexture: true })
}
