import os
import json
import random
from aiohttp import web
from server import PromptServer
import folder_paths
import comfy.utils
import comfy.sd

class RandomLoraLoader:
    def __init__(self):
        self.loaded_lora = None

    @classmethod
    def INPUT_TYPES(cls):
        loras = ["None"] + folder_paths.get_filename_list("loras")
        required = {
            "model": ("MODEL",),
            "clip": ("CLIP",),
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            "lora_1_name": (loras, {"default": "None"}),
            "lora_1_strength": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
        }
        
        # 2 to 15 optional widgets
        for i in range(2, 16):
            required[f"lora_{i}_name"] = (loras, {"default": "None"})
            required[f"lora_{i}_strength"] = ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01})
            
        return {
            "required": required
        }

    RETURN_TYPES = ("MODEL", "CLIP")
    RETURN_NAMES = ("model", "clip")
    FUNCTION = "load_random_lora"
    CATEGORY = "loaders"

    def load_random_lora(self, model, clip, seed, **kwargs):
        valid_loras = []
        for i in range(1, 16):
            name_key = f"lora_{i}_name"
            strength_key = f"lora_{i}_strength"
            
            lora_name = kwargs.get(name_key, "None")
            strength = kwargs.get(strength_key, 1.0)
            
            if lora_name and lora_name != "None":
                valid_loras.append((lora_name, strength))
                
        if not valid_loras:
            return (model, clip)
            
        rng = random.Random(seed)
        selected_lora_name, selected_strength = rng.choice(valid_loras)
        
        lora_path = folder_paths.get_full_path("loras", selected_lora_name)
        if not lora_path or not os.path.exists(lora_path):
            return (model, clip)
            
        lora = None
        if self.loaded_lora is not None:
            if self.loaded_lora[0] == lora_path:
                lora = self.loaded_lora[1]
            else:
                temp = self.loaded_lora
                self.loaded_lora = None
                del temp

        if lora is None:
            lora = comfy.utils.load_torch_file(lora_path, safe_load=True)
            self.loaded_lora = (lora_path, lora)

        model_lora, clip_lora = comfy.sd.load_lora_for_models(model, clip, lora, selected_strength, selected_strength)
        return (model_lora, clip_lora)



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
