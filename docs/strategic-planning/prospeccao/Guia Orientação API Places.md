Este guia completo orienta o desenvolvimento de uma solução em duas etapas utilizando a **API Places (Nova)** para extrair IDs de lugares com base em termos de pesquisa geográficos e, em seguida, consultar detalhes específicos de cada local.

---

### **Observação Importante sobre Grounding (Emails)**

Com base na documentação oficial dos **Campos de Dados de Lugares (Novo)**, **a API Places não disponibiliza o campo de e-mail** dos estabelecimentos. Para obter o e-mail, o fluxo recomendado é extrair o site do estabelecimento (`websiteUri`) na Etapa 2 e, posteriormente, utilizar um script complementar de raspagem de dados (web scraping) próprio no domínio retornado.

---

### **Arquitetura da Solução**

O fluxo do seu agente será dividido em:

1. **Etapa 1: Text Search (Novo)** – Envia uma string de busca (`textQuery`) e opcionalmente restrições geográficas para obter uma lista de locais correspondentes e seus respectivos IDs (`id`).  
2. **Etapa 2: Place Details (Novo)** – Consulta individualmente cada ID de lugar extraído para obter informações ricas e detalhadas de contato e avaliação.

---

## **ETAPA 1: Busca de Locais e Extração de IDs (`places.id`)**

Para buscar um local de maneira flexível combinando o nome do estabelecimento e uma localização (cidade, estado ou país), a melhor ferramenta é o **Text Search (Novo)**. Esta API aceita strings de busca livres como *"restaurantes em São Paulo"* ou *"oficinas em Belo Horizonte"*.

### **1\. Endpoint e Método**

* **Endpoint:** `https://places.googleapis.com/v1/places:searchText`  
* **Método HTTP:** `POST`

### **2\. Cabeçalhos Obrigatórios**

* `Content-Type: application/json`  
* `X-Goog-Api-Key: SUA_CHAVE_DE_API`  
* **`X-Goog-FieldMask`:** Define quais dados serão retornados. Para esta etapa, solicite estritamente os IDs e nomes básicos para otimizar os custos e a latência. Use: `places.id,places.displayName,places.formattedAddress`

### **3\. Restrição Geográfica (Cidade, Estado ou País)**

Você pode refinar a busca de três formas:

* **Na própria Query:** Incluindo a cidade/estado no texto de busca (ex: *"Plumbing em Curitiba, Paraná"*).  
* **`locationRestriction` ou `locationBias` (Cidades ou Estados):** Define uma janela de visualização retangular (Viewport) que delimita geograficamente onde a busca deve focar.  
* **`includedRegionCodes` (Países):** Se você deseja limitar os resultados a um país específico, utilize este parâmetro passando uma lista de códigos CLDR/ISO de 2 dígitos (ex: `["br"]` para o Brasil).

### **Exemplo de Requisição (cURL)**

O exemplo abaixo pesquisa por *"clothes"* enviesando os resultados para um círculo no centro de uma região específica:

curl \-X POST \-d '{  
  "textQuery": "clothes",  
  "pageSize": 5,  
  "locationBias": {  
    "circle": {  
      "center": {  
        "latitude": 37.321328,  
        "longitude": \-121.946275  
      },  
      "radius": 500.0  
    }  
  }  
}' \\  
\-H 'Content-Type: application/json' \\  
\-H 'X-Goog-Api-Key: SUA\_CHAVE\_DE\_API' \\  
\-H 'X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress' \\  
'https://places.googleapis.com/v1/places:searchText'

### **Exemplo de Resposta (JSON)**

O retorno conterá o array de locais. Colete o campo `"id"` de cada objeto para a próxima etapa:

{  
  "places": \[  
    {  
      "id": "ChIJ8WvuSB7Lj4ARFyHppkxDRQ4",  
      "formattedAddress": "2855 Stevens Creek Blvd, Santa Clara, CA 95050, USA",  
      "displayName": {  
        "text": "Macy's",  
        "languageCode": "en"  
      }  
    }  
  \]  
}

---

## **ETAPA 2: Consulta de Detalhes do Lugar (Place Details Novo)**

Com a lista de IDs em mãos, o agente fará consultas individuais para cada ID de interesse. Essa chamada é muito mais econômica do que reemitir buscas textuais.

### **1\. Endpoint e Método**

* **Endpoint:** `https://places.googleapis.com/v1/places/PLACE_ID` (substitua `PLACE_ID` pelo ID obtido na Etapa 1\)  
* **Método HTTP:** `GET`

### **2\. Mapeamento de Campos e SKUs de Faturamento**

Para evitar cobranças surpresa e otimizar a latência, configure o cabeçalho `X-Goog-FieldMask` para solicitar apenas os campos estritos requeridos. O Google divide esses campos em diferentes SKUs tarifárias:

| Informação Desejada | Nome do Campo na API | Tipo de SKU Google Platform |
| ----- | ----- | ----- |
| **ID do Lugar** | `id` | Essentials (IDs Only) |
| **Nome do Estabelecimento** | `displayName` | Place Details Pro |
| **Endereço Completo** | `formattedAddress` | Place Details Essentials |
| **Nota da Avaliação** | `rating` | Place Details Enterprise |
| **Quantidade de Avaliações** | `userRatingCount` | Place Details Enterprise |
| **Telefone de Contato** | `internationalPhoneNumber` (ou `nationalPhoneNumber`) | Place Details Enterprise |
| **Site Oficial** | `websiteUri` | Place Details Enterprise |

**FieldMask Recomendado:** `X-Goog-FieldMask: id,displayName,formattedAddress,rating,userRatingCount,internationalPhoneNumber,websiteUri`

### **Exemplo de Requisição (cURL)**

curl \-X GET \\  
\-H 'Content-Type: application/json' \\  
\-H "X-Goog-Api-Key: SUA\_CHAVE\_DE\_API" \\  
\-H "X-Goog-FieldMask: id,displayName,formattedAddress,rating,userRatingCount,internationalPhoneNumber,websiteUri" \\  
https://places.googleapis.com/v1/places/ChIJ8WvuSB7Lj4ARFyHppkxDRQ4

### **Exemplo de Resposta (JSON)**

{  
  "id": "ChIJ8WvuSB7Lj4ARFyHppkxDRQ4",  
  "formattedAddress": "2855 Stevens Creek Blvd, Santa Clara, CA 95050, USA",  
  "displayName": {  
    "text": "Macy's",  
    "languageCode": "en"  
  },  
  "internationalPhoneNumber": "+1 408-248-3333",  
  "rating": 4.0,  
  "userRatingCount": 1245,  
  "websiteUri": "https://l.macys.com/santa-clara-ca"  
}

---

## **Implementação Prática em Python (Asíncrona)**

Para que o seu agente faça essas extrações de forma rápida e eficiente, utilize a biblioteca de cliente oficial do Google em Python (`google-maps-places`).

### **Instalação**

pip install google-maps-places

### **Script do Agente de Extração (Python)**

Este exemplo demonstra como estruturar seu código usando as chamadas assíncronas do SDK oficial para agilizar o processamento em lotes:

import asyncio  
from google.maps import places\_v1

\# Inicialize o cliente passando sua API Key  
\# Certifique-se de manter sua chave de API segura  
API\_KEY \= "SUA\_CHAVE\_DE\_API"  
client \= places\_v1.PlacesAsyncClient(client\_options={"api\_key": API\_KEY})

async def extrair\_place\_ids(termo\_busca: str):  
    """Etapa 1: Executa a busca textual e retorna a lista de IDs de locais."""  
    \# Cria a requisição Text Search  
    request \= places\_v1.SearchTextRequest(  
        text\_query=termo\_busca  
    )

    \# Define a máscara de campos para retornar apenas ID e Nome básico  
    field\_mask \= "places.id,places.displayName"

    try:  
        response \= await client.search\_text(  
            request=request,  
            metadata=\[("x-goog-fieldmask", field\_mask)\]  
        )

        \# Extrai os IDs dos locais encontrados  
        place\_ids \= \[place.id for place in response.places if place.id\]  
        return place\_ids  
    except Exception as e:  
        print(f"Erro na Etapa 1: {e}")  
        return \[\]

async def obter\_detalhes\_do\_lugar(place\_id: str):  
    """Etapa 2: Consulta os detalhes ricos de um local com base no ID."""  
    \# O recurso de nome deve seguir o padrão 'places/PLACE\_ID'  
    resource\_name \= f"places/{place\_id}"

    request \= places\_v1.GetPlaceRequest(  
        name=resource\_name  
    )

    \# Campo máscara contendo as informações pedidas (Contato, Avaliação e Site)  
    field\_mask \= "id,displayName,formattedAddress,rating,userRatingCount,internationalPhoneNumber,websiteUri"

    try:  
        place\_details \= await client.get\_place(  
            request=request,  
            metadata=\[("x-goog-fieldmask", field\_mask)\]  
        )  
        return place\_details  
    except Exception as e:  
        print(f"Erro ao obter detalhes para o ID {place\_id}: {e}")  
        return None

async def pipeline\_agente(busca: str):  
    print(f"Iniciando Etapa 1: Buscando locais para '{busca}'...")  
    ids \= await extrair\_place\_ids(busca)  
    print(f"Encontrados {len(ids)} locais. Iniciando Etapa 2 (Consulta de Detalhes)...")

    \# Executa as consultas de detalhes em paralelo para otimização de tempo  
    tarefas \= \[obter\_detalhes\_do\_lugar(pid) for pid in ids\]  
    resultados \= await asyncio.gather(\*tarefas)

    for local in resultados:  
        if local:  
            print("\\n" \+ "="\*40)  
            print(f"Nome: {local.display\_name.text if local.display\_name else 'N/A'}")  
            print(f"Endereço: {local.formatted\_address}")  
            print(f"Avaliação: {local.rating} estrelas ({local.user\_rating\_count} avaliações)")  
            print(f"Telefone: {local.international\_phone\_number}")  
            print(f"Site: {local.website\_uri}")  
            print("E-mail: \[Requer scraping manual do domínio do site\]")  
            print("="\*40)

\# Para rodar o pipeline:  
\# asyncio.run(pipeline\_agente("restaurantes em Campinas, SP"))

---

### **Práticas Recomendadas para o Agente**

1. **Otimização de Custos:** Nunca utilize a máscara de campo curinga (`*`) em ambiente de produção. Solicite somente os campos listados na Etapa 2 para evitar faturamentos de SKUs desnecessárias.  
2. **Armazenamento de IDs:** O Google permite que você salve e armazene os `place_id` em banco de dados para uso posterior (eles estão isentos das restrições habituais de cache). Contudo, recomenda-se atualizar os IDs que possuam mais de 12 meses, fazendo uma chamada leve de atualização.  
3. **Tratamento de IDs Obsoletos:** Em casos de empresas fechadas ou realocadas, a API pode retornar erros como `NOT_FOUND`. Prepare o agente para lidar com essas exceções reemitindo a busca original ou atualizando o ID usando os campos `movedPlace` e `movedPlaceId`.

🎧 Gostaria que eu criasse um áudio resumo focado nas melhores práticas de migração e no impacto de custo que a nova API Places (Nova) pode trazer para o seu projeto?

