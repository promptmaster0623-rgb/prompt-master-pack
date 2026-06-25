import random
import torch
import folder_paths
import comfy.sd

class RandomUNETLoader:
    @classmethod
    def INPUT_TYPES(cls):
        unets_raw = folder_paths.get_filename_list("diffusion_models")
        unets = ["None"] + unets_raw
        unet_1_default = unets_raw[0] if unets_raw else "None"
        dtypes = ["default", "fp8_e4m3fn", "fp8_e4m3fn_fast", "fp8_e5m2"]
        
        required = {
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            "unet_1_name": (unets, {"default": unet_1_default}),
            "unet_1_dtype": (dtypes, {"default": "default"}),
        }
        
        # 2 to 15 optional widgets
        for i in range(2, 16):
            required[f"unet_{i}_name"] = (unets, {"default": "None"})
            required[f"unet_{i}_dtype"] = (dtypes, {"default": "default"})
            
        return {
            "required": required
        }

    RETURN_TYPES = ("MODEL",)
    RETURN_NAMES = ("model",)
    FUNCTION = "load_random_unet"
    CATEGORY = "loaders"

    def load_random_unet(self, seed, **kwargs):
        valid_unets = []
        for i in range(1, 16):
            name_key = f"unet_{i}_name"
            dtype_key = f"unet_{i}_dtype"
            
            unet_name = kwargs.get(name_key, "None")
            dtype = kwargs.get(dtype_key, "default")
            
            if unet_name and unet_name != "None":
                valid_unets.append((unet_name, dtype))
                
        if not valid_unets:
            raise RuntimeError("No valid UNET models selected in Random UNET Loader.")
            
        rng = random.Random(seed)
        selected_unet_name, selected_dtype = rng.choice(valid_unets)
        
        unet_path = folder_paths.get_full_path_or_raise("diffusion_models", selected_unet_name)
        
        model_options = {}
        if selected_dtype == "fp8_e4m3fn":
            model_options["dtype"] = torch.float8_e4m3fn
        elif selected_dtype == "fp8_e4m3fn_fast":
            model_options["dtype"] = torch.float8_e4m3fn
            model_options["fp8_optimizations"] = True
        elif selected_dtype == "fp8_e5m2":
            model_options["dtype"] = torch.float8_e5m2
            
        model = comfy.sd.load_diffusion_model(unet_path, model_options=model_options)
        return (model,)
