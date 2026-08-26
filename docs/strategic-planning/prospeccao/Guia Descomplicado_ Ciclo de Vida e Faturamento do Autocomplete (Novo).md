### Guia Descomplicado: Ciclo de Vida e Faturamento do Autocomplete (Novo)

#### 1\. Introdução: O que é uma Sessão e por que ela importa?

No universo do desenvolvimento de interfaces de busca, a eficiência não diz respeito apenas à velocidade, mas à inteligência no gerenciamento de custos. No contexto do  **Autocomplete (Novo)**  da Google Maps Platform, o conceito de  **Sessão**  é o seu maior aliado.Uma sessão agrupa toda a jornada de interação do usuário — desde o primeiro caractere digitado até a seleção final de um local — em um único bloco de faturamento. Sem ela, cada sugestão gerada pelo teclado seria tratada como uma transação isolada, tornando o projeto financeiramente inviável.**Marcos de uma Sessão:**

* **Início:**  Dispara com a primeira solicitação de Autocomplete (Novo) que inclui um token de sessão válido.  
* **Continuidade:**  Abrange cada solicitação subsequente enquanto o usuário refina sua busca.  
* **Encerramento:**  Ocorre obrigatoriamente através de uma chamada de  **Place Details (Novo)**  ou  **Address Validation**  utilizando o mesmo token.Essa estrutura garante previsibilidade. Contudo, para que essa engrenagem funcione, precisamos de um "fio condutor": o Token de Sessão.

#### 2\. Desmistificando o Token de Sessão: O fio condutor da busca

O sessionToken é uma string única gerada pelo seu aplicativo para identificar uma jornada de busca específica. Como Arquiteto, eu  **exijo**  que você utilize o mesmo token em todas as etapas; caso contrário, o Google não conseguirá agrupar as chamadas e o custo disparará.

##### O Ciclo de Vida do Token:

1. **Geração:**  O aplicativo cria o token no momento em que o usuário foca na barra de pesquisa.  
2. **Passagem:**  Este token deve ser enviado em todas as chamadas de Autocomplete (Novo).  
3. **Encerramento:**  O token é enviado na chamada final (Detalhes ou Validação) para consolidar a sessão.  
4. **Expiração:**  Uma vez encerrada a sessão, o token perde a validade. Reutilizá-lo fará com que as novas chamadas sejam faturadas individualmente.Embora o token organize a busca, o custo real é determinado pelo "ponto final" — ou seja, quais dados você solicita no encerramento.

#### 3\. Entendendo as SKUs e as Regras de Cobrança

O faturamento é dividido entre Autocomplete Requests (cobrança individual) e Autocomplete Session Usage (agrupamento por sessão). Aqui, aplicamos a  **Regra de Ouro das 12 solicitações** : o Google monitora a quantidade de requisições disparadas (não o número de teclas, mas as chamadas de API feitas, geralmente debouncadas).

##### Comparativo de Cenários de Faturamento

Tipo de Encerramento,Faturamento do Autocomplete,Faturamento da Chamada Final  
Place Details Essentials,Cobrado por solicitação (até o limite de 12),Cobrado por SKU Essentials  
Place Details Pro/Enterprise,Sem custo  (SKU: Session Usage),Cobrado pela SKU do campo mais caro  
Address Validation,Sem custo  (SKU: Session Usage),Cobrado por SKU Address Validation  
**⚠️ Alerta Técnico: O risco do "IDs Only"**  Se você encerrar a sessão chamando a SKU Place Details Essentials (IDs Only), o faturamento  **reverte**  para o modelo por solicitação.  **Entenda o porquê:**  como a chamada de "IDs Only" custa $0, o Google não tem uma transação paga para subsidiar o custo das buscas prévias. Portanto, evite esse encerramento se o usuário fizer muitas requisições de Autocomplete.

#### 4\. Cenários Práticos: A jornada do usuário e o impacto financeiro

##### Cenário A: Dados de Local (Latitude/Longitude)

O usuário busca um endereço para visualização simples. O app solicita apenas location e formattedAddress no final.

* **Impacto:**  Estes são campos  **Essentials** . O Google cobrará pelas primeiras 12 solicitações de Autocomplete da sessão. A partir da 13ª solicitação, as sugestões passam a ser gratuitas sob a SKU de Session Usage.

##### Cenário B: Descoberta de Lugares (Avaliações/Horários)

O usuário busca um restaurante e o app solicita rating (Enterprise) e parkingOptions (Enterprise \+ Atmosphere).

* **Impacto:**  Ao solicitar campos das categorias Pro, Enterprise ou Atmosphere, o custo de  **todas**  as chamadas de Autocomplete é zerado. Você paga apenas o valor da SKU de encerramento (neste caso, a de maior nível: Enterprise \+ Atmosphere).

##### Cenário C: Checkout e Entrega (O Caminho de Ouro)

Em fluxos de e-commerce, o usuário seleciona um local e o app utiliza a API de Address Validation.

* **Impacto:**  O Autocomplete é totalmente gratuito.  **Dica de Arquiteto:**  Você pode realizar uma chamada de Place Details Essentials sem custo  *antes*  da validação final. Isso permite mostrar o local no mapa (usando as coordenadas do Details) para confirmação do usuário antes de realizar a cobrança da Validação de Endereço.

#### 5\. Sessões Abandonadas e Buscas sem Token

Negligenciar a implementação técnica impacta diretamente o orçamento do seu projeto. Monitore estes dois riscos:

* **Busca Sem Token:**   **Evite terminantemente.**  Sem o sessionToken, cada caractere que dispara uma requisição é cobrado como uma Autocomplete Request cheia.  
* **Sessão Abandonada:**  Se o usuário iniciar a busca e fechar o app sem selecionar um local (ou seja, sem chamar Detalhes ou Validação), a sessão não se consolida. O Google faturará todas as solicitações de Autocomplete feitas até o abandono individualmente.

#### 6\. Otimização: O Poder da Máscara de Campos (FieldMask)

A FieldMask é a ferramenta de precisão do Arquiteto. Ela impede que você pague por dados que seu aplicativo não utiliza. A escolha dos campos define a SKU de faturamento da sessão:

* **Essentials (Básico):**  location, formattedAddress, types, viewport.  
* **Pro (Intermediário):**  displayName, accessibilityOptions, utcOffsetMinutes.  
* **Enterprise (Avançado):**  rating, currentOpeningHours, priceLevel.  
* **Enterprise \+ Atmosphere (Premium):**  reviews, parkingOptions, allowsDogs.**Dica de Ouro: Proíba o uso do Curinga (\*)**  Utilizar \* na sua FieldMask em produção é um erro grave de arquitetura. Ao pedir "tudo", você força o faturamento para a SKU mais cara (Enterprise \+ Atmosphere), mesmo que só precise do endereço básico.  **Especifique sempre os campos exatos.**

#### 7\. Encerramento: Resumo da Aprendizagem

Para dominar o Autocomplete (Novo) e manter os custos sob controle, foque nestes pilares:

1. **Token é a Lei:**  Sem ele, não há sessão, apenas cobranças individuais e desordenadas.  
2. **Regra das 12 Requisições:**  Entenda que em buscas básicas (Essentials), o custo é limitado às primeiras 12 chamadas; em buscas ricas (Pro/Ent), o Autocomplete é um benefício gratuito.  
3. **Encerre com Intencionalidade:**  Escolha campos que justifiquem o custo da SKU e evite o encerramento com "IDs Only" se houver alto volume de interações prévias.Aplique estas estratégias para criar sistemas de busca que sejam referência em performance técnica e saúde financeira.

