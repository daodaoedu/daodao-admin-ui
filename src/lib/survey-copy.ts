/** Reserve the copy suffix within the server's 200 UTF-16 code unit limit without splitting a code point. */
export function copySurveyTitle(title: string): string {
  const suffix = '（副本）'
  const prefixLimit = 200 - suffix.length
  let prefix = ''
  for (const character of title) {
    if (prefix.length + character.length > prefixLimit) break
    prefix += character
  }
  return `${prefix}${suffix}`
}
