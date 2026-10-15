-- Miniatura raster compactada; acessível somente pela API autenticada do piloto.
alter table piloto_contas add column foto text check(foto is null or (length(foto)<=220000 and foto ~ '^data:image/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$'));
