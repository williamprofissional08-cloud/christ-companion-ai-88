# Música ambiente — Agnus Dei

O aplicativo incorpora o vídeo oficial de **“Agnus Dei”**, de **Depths of Worship**, usando o player incorporado do YouTube.

- **Artista/canal:** Depths of Worship.
- **Vídeo oficial escolhido:** https://www.youtube.com/watch?v=HR9coYxhYKw
- **Lançamento oficial nas plataformas:** https://open.spotify.com/album/37WOTFMwBPcaY5REpVEApw
- **Página oficial de distribuição do artista:** https://distrokid.com/hyperfollow/depthsofworship/agnus-dei

O áudio não é baixado, extraído do YouTube nem hospedado pelo aplicativo. A reprodução é fornecida pelo player oficial do YouTube, respeitando os controles e as condições da plataforma. O parâmetro de loop usa o próprio ID do vídeo como playlist, fazendo a reprodução reiniciar ao terminar. O player permanece montado no layout autenticado para continuar disponível durante a navegação entre as áreas do app.

## Comportamento e limitações

- O atalho compacto “Agnus Dei” fica fixo no canto inferior direito.
- Ao abrir o atalho, a pessoa pode iniciar, pausar e controlar a reprodução pelos controles nativos do YouTube.
- O vídeo está configurado para repetir continuamente (`loop=1` com `playlist` igual ao ID do vídeo).
- O navegador e o player de terceiros podem bloquear reprodução automática. A pessoa precisa tocar em Reproduzir; não se promete início automático.
- A continuidade entre rotas depende de o layout autenticado permanecer montado. Recolher a interface não pausa a música; para pausar, use o controle nativo do vídeo.
- O vídeo de referência é uma versão estendida. A duração e a disponibilidade dependem do canal e do YouTube.

A gravação clássica de Palestrina anteriormente usada foi removida deste componente. O embed do Spotify foi substituído pelo vídeo oficial solicitado para habilitar o loop contínuo sem copiar nem hospedar o arquivo de áudio.
