import { Jimp } from "jimp";

async function main() {
  try {
    console.log("Iniciando conversão de ícones...");
    
    const sourcePath = "src/assets/images/pdi_app_icon_1781787191395.jpg";
    const image = await Jimp.read(sourcePath);
    
    // Suporta API antiga e nova do Jimp para redimensionamento e gravação
    // No Jimp v1+, resize se faz com { w: width, h: height } ou usando métodos encadeados
    const img192 = image.clone();
    if (typeof img192.resize === "function") {
      try {
        await img192.resize({ w: 192, h: 192 });
      } catch {
        await img192.resize(192, 192);
      }
    }
    await img192.write("public/pdi_icon_192.png");
    
    const img512 = image.clone();
    if (typeof img512.resize === "function") {
      try {
        await img512.resize({ w: 512, h: 512 });
      } catch {
        await img512.resize(512, 512);
      }
    }
    await img512.write("public/pdi_icon_512.png");
    
    console.log("Sucesso! Os ícones PNG foram gerados e salvos em /public:");
    console.log(" - public/pdi_icon_192.png (192x192)");
    console.log(" - public/pdi_icon_512.png (512x512)");
  } catch (err) {
    console.error("Erro durante a conversão do ícone:", err);
    
    // Fallback: Tentativa com antiga API padrão caso jimp seja importado default
    try {
      console.log("Tentando fallback de carregamento do Jimp...");
      const JimpDefaultModule = await import("jimp");
      const JimpDefault = JimpDefaultModule.default || JimpDefaultModule;
      const image = await JimpDefault.read("src/assets/images/pdi_app_icon_1781787191395.jpg");
      
      const img192 = image.clone().resize(192, 192);
      await img192.write("public/pdi_icon_192.png");
      
      const img512 = image.clone().resize(512, 512);
      await img512.write("public/pdi_icon_512.png");
      console.log("Instanciado com JimpDefault com sucesso!");
    } catch (fallbackErr) {
      console.error("Erro persistente no Fallback:", fallbackErr);
    }
  }
}

main();
