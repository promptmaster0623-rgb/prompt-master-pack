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
            "weight_mode": (["individual", "common"], {"default": "individual"}),
            "common_type": (["fixed", "random"], {"default": "fixed"}),
            "common_fixed_strength": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
            "common_min_strength": ("FLOAT", {"default": 0.0, "min": -10.0, "max": 10.0, "step": 0.01}),
            "common_max_strength": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
            
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

    def load_random_lora(self, model, clip, seed, weight_mode, common_type, common_fixed_strength, common_min_strength, common_max_strength, **kwargs):
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
        
        # 가중치 모드 설정 적용
        if weight_mode == "common":
            if common_type == "fixed":
                selected_strength = common_fixed_strength
            elif common_type == "random":
                # 시드에 기반하여 고정된 범위 내의 랜덤값 계산
                selected_strength = rng.uniform(common_min_strength, common_max_strength)
        
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
