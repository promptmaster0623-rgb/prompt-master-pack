import os
import random
import folder_paths
import comfy.utils
import comfy.sd

class RandomLoraLoader:
    def __init__(self):
        self.loaded_lora = None

    @classmethod
    def INPUT_TYPES(cls):
        loras_raw = folder_paths.get_filename_list("loras")
        loras = ["None"] + loras_raw
        lora_1_default = loras_raw[0] if loras_raw else "None"
        
        required = {
            "model": ("MODEL",),
            "clip": ("CLIP",),
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            "lora_1_name": (loras, {"default": lora_1_default}),
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
