/**
 * Templates Module for SIND-GOCG
 * Contains official templates for different types of hearings (testemunha and sindicado)
 */

/**
 * Gets the template for a witness hearing (testemunha)
 * @param {Object} data - Hearing data containing witness information
 * @returns {string} The formatted template text
 */
export function getTermoTestemunha(data) {
  const numeroProcesso = data.numeroProcesso || data.inquiryId || '______________________';
  const nomeTestemunha = data.nomeTestemunha || data.witnessName || '______________________________________';
  const postoGraduacao = data.postoGraduacao || data.witnessRank || '______________________';
  
  return `TERMO DE OITIVA DE TESTEMUNHA

Aos ____ dias do mês de __________ do ano de ______, nesta cidade de ____________________, no Estado de ____________________, nas dependências de ____________________, sito à __________________________________, iniciou-se às ____h____min a audiência da sindicância de Portaria SEI nº ${numeroProcesso}.

Estando presentes este(a) sindicante e a testemunha abaixo qualificada, foi inquirida sobre os fatos, declarando o seguinte:

TESTEMUNHA: ${nomeTestemunha}, posto/graduação ${postoGraduacao}, RG nº ______________________, Id Funcional ______________________, lotado(a) em ______________________, filho(a) de ______________________ e de ______________________.

Após prestar o compromisso legal de dizer a verdade,

PERGUNTADO sobre seu conhecimento dos fatos relativos ao extravio da capa de aproximação, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

PERGUNTADO se presenciou algum ato ou situação envolvendo a citada capa de aproximação, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

PERGUNTADO se possui informações adicionais que possam contribuir para a elucidação, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

Nada mais tendo a declarar, deu-se por findo o presente termo, iniciado às ____h____min e concluído às ____h____min, que, depois de lido e achado conforme, vai assinado por mim, sindicante, e pela testemunha.

________________________________________
TESTEMUNHA
Posto/Graduação: ${postoGraduacao}
RG: ______________________ | Id Funcional: ______________________

________________________________________
SINDICANTE
Posto/Graduação: ______________________
RG: ______________________ | Id Funcional: ______________________`;
}

/**
 * Gets the template for a defendant hearing (sindicado)
 * @param {Object} data - Hearing data containing defendant information  
 * @returns {string} The formatted template text
 */
export function getTermoSindicado(data) {
  const numeroProcesso = data.numeroProcesso || data.inquiryId || '______________________';
  const nomeTestemunha = data.nomeTestemunha || data.witnessName || '______________________________________';
  const postoGraduacao = data.postoGraduacao || data.witnessRank || '______________________';
  
  return `TERMO DE OITIVA DE SINDICADO

Aos ____ dias do mês de __________ do ano de ______, nesta cidade de ____________________, no Estado de ____________________, nas dependências de ____________________, sito à __________________________________, iniciou-se às ____h____min a audiência da sindicância de Portaria SEI nº ${numeroProcesso}.

Estando presentes este(a) sindicante e o(a) sindicado(a), foi inquirido(a) sobre os fatos, declarando o seguinte:

SINDICADO(A): ${nomeTestemunha}, posto/graduação ${postoGraduacao}, RG nº ______________________, Id Funcional ______________________, lotado(a) em ______________________, filho(a) de ______________________ e de ______________________.

Após assumir o compromisso de dizer a verdade,

PERGUNTADO sobre a data e circunstâncias em que verificou o extravio da capa de aproximação, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

PERGUNTADO sobre onde a capa de aproximação estava acondicionada e quais providências tomou ao perceber o extravio, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

PERGUNTADO se tem ciência de quem poderia ter manuseado a capa ou qualquer detalhe adicional, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

PERGUNTADO se deseja acrescentar algo, RESPONDEU: ________________________________________________________________________________________________________________________________________________________________.

Nada mais tendo a declarar, deu-se por findo o presente termo, iniciado às ____h____min e concluído às ____h____min, que, depois de lido e achado conforme, vai assinado por mim, sindicante, e pelo(a) sindicado(a).

________________________________________
SINDICADO(A)
Posto/Graduação: ${postoGraduacao}
RG: ______________________ | Id Funcional: ______________________

________________________________________
SINDICANTE
Posto/Graduação: ______________________
RG: ______________________ | Id Funcional: ______________________`;
}

/**
 * Gets the appropriate template based on hearing type
 * @param {string} hearingType - 'testemunha' or 'sindicado'
 * @param {Object} data - Hearing data
 * @returns {string} The formatted template text
 */
export function getTemplate(hearingType, data) {
  if (hearingType === 'sindicado') {
    return getTermoSindicado(data);
  } else {
    // Default to testemunha template
    return getTermoTestemunha(data);
  }
}