import os
import json
from aiohttp import web
from server import PromptServer

class EasyGuideMaker:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "guide_data": ("STRING", {"multiline": True, "default": "{}"}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("guide_json",)
    FUNCTION = "process"
    CATEGORY = "가이드"
    OUTPUT_NODE = True

    def process(self, guide_data):
        return (guide_data,)


class EasyGuideViewer:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "guide_data": ("STRING", {"forceInput": True}),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "process"
    CATEGORY = "가이드"
    OUTPUT_NODE = True

    def process(self, guide_data):
        return {}


# Register API endpoints
@PromptServer.instance.routes.post("/easy-guide/save")
async def save_guide_json(request):
    try:
        data = await request.json()
        workflow_name = data.get("workflow_name", "default_workflow")
        # Sanitize folder name
        workflow_name = "".join([c for c in workflow_name if c.isalpha() or c.isdigit() or c in (" ", "_", "-")]).rstrip()
        if not workflow_name:
            workflow_name = "default_workflow"
            
        json_data = data.get("json_data", {})
        
        # Path: custom_nodes/prompt-master-pack/guides/<workflow_name>/
        current_dir = os.path.dirname(os.path.abspath(__file__))
        target_dir = os.path.join(current_dir, "guides", workflow_name)
        os.makedirs(target_dir, exist_ok=True)
        
        target_file = os.path.join(target_dir, "easy_guide_settings.json")
        with open(target_file, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
            
        return web.json_response({"status": "success", "path": target_file})
    except Exception as e:
        return web.json_response({"status": "error", "message": str(e)}, status=500)
