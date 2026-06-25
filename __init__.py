from .nodes import EasyGuideMaker, EasyGuideViewer, RandomLoraLoader, RandomUNETLoader

NODE_CLASS_MAPPINGS = {
    "EasyGuideMaker": EasyGuideMaker,
    "EasyGuideViewer": EasyGuideViewer,
    "RandomLoraLoader": RandomLoraLoader,
    "RandomUNETLoader": RandomUNETLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "EasyGuideMaker": "이지 가이드 메이커 (Easy Guide Maker)",
    "EasyGuideViewer": "이지 가이드 뷰어 (Easy Guide Viewer)",
    "RandomLoraLoader": "Random LoRA Loader(랜덤로라로더)",
    "RandomUNETLoader": "Random UNET Loader(랜덤확산모델로더)",
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]


