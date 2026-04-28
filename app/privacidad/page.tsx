import Link from 'next/link'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-10">
          <div className="mb-8">
            <Link href="/" className="text-sm text-[#C9A227] hover:underline mb-4 inline-block">
              ← Volver al inicio
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Política de Privacidad</h1>
            <p className="text-sm text-gray-500 mt-1">Comunidad de Propietarios Parcela 8</p>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
              <p>
                El responsable del tratamiento de sus datos personales es la <strong>Comunidad de Propietarios Parcela 8</strong>,
                representada por el Presidente de la Comunidad, con domicilio en la dirección de la comunidad.
              </p>
              <p>Contacto: <a href="mailto:parcela8pi@gmail.com" className="text-[#C9A227] hover:underline">parcela8pi@gmail.com</a></p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Finalidad del tratamiento</h2>
              <p>Sus datos personales son tratados con las siguientes finalidades:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Gestión y seguimiento de incidencias en zonas comunes de la comunidad de propietarios.</li>
                <li>Comunicación con los vecinos afectados sobre el estado de las incidencias reportadas.</li>
                <li>Coordinación con el administrador de fincas y el presidente de la comunidad para la resolución de problemas.</li>
                <li>Notificación por email sobre la evolución de las incidencias registradas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Base legal del tratamiento</h2>
              <p>El tratamiento de sus datos personales se basa en:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  <strong>Art. 6.1.c) RGPD</strong>: Cumplimiento de una obligación legal aplicable al responsable del tratamiento,
                  en concreto la Ley 49/1960, de 21 de julio, sobre Propiedad Horizontal, que obliga a la comunidad a gestionar
                  el mantenimiento y conservación de los elementos comunes.
                </li>
                <li>
                  <strong>Art. 6.1.f) RGPD</strong>: Interés legítimo de la comunidad de propietarios en la gestión eficiente
                  de las incidencias que afectan a los elementos comunes.
                </li>
                <li>
                  <strong>Art. 6.1.a) RGPD</strong>: Consentimiento del interesado, prestado al marcar la casilla de aceptación
                  en el formulario de envío de incidencias.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Datos tratados</h2>
              <p>Los datos personales que se recopilan a través del formulario de incidencias son:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Nombre y apellidos</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono (opcional)</li>
                <li>Ubicación dentro de la comunidad (calle, bloque, piso)</li>
                <li>Descripción e imágenes de la incidencia reportada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Destinatarios de los datos</h2>
              <p>Sus datos podrán ser comunicados a:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Administrador de fincas</strong>: para la gestión y resolución de la incidencia.</li>
                <li><strong>Presidente de la Comunidad</strong>: para supervisión y seguimiento.</li>
                <li><strong>Empresas de mantenimiento o reparación</strong>: únicamente los datos necesarios para la resolución de la incidencia, bajo acuerdo de confidencialidad.</li>
              </ul>
              <p className="mt-2">
                No se cederán sus datos a terceros salvo obligación legal o para la prestación de los servicios indicados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Plazo de conservación</h2>
              <p>
                Sus datos personales se conservarán durante el tiempo necesario para la gestión de la incidencia y,
                posteriormente, durante el plazo legalmente establecido para atender posibles responsabilidades derivadas
                del tratamiento. En ningún caso se conservarán más de <strong>5 años</strong> desde la resolución de la incidencia,
                salvo obligación legal que exija un período mayor.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Sus derechos (Derechos ARCO y ampliados)</h2>
              <p>De acuerdo con el RGPD y la LOPDGDD, usted tiene derecho a:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Acceso</strong>: Conocer qué datos personales suyos estamos tratando.</li>
                <li><strong>Rectificación</strong>: Corregir datos inexactos o incompletos.</li>
                <li><strong>Supresión (Cancelación / Derecho al olvido)</strong>: Solicitar la eliminación o anonimización de sus datos cuando ya no sean necesarios.</li>
                <li><strong>Oposición</strong>: Oponerse al tratamiento de sus datos en determinadas circunstancias.</li>
                <li><strong>Portabilidad</strong>: Recibir sus datos en un formato estructurado y de uso común.</li>
                <li><strong>Limitación del tratamiento</strong>: Solicitar la suspensión del tratamiento de sus datos.</li>
              </ul>
              <p className="mt-3">
                Para ejercer cualquiera de estos derechos, puede dirigirse por escrito a:{' '}
                <a href="mailto:parcela8pi@gmail.com" className="text-[#C9A227] hover:underline">parcela8pi@gmail.com</a>,
                indicando el derecho que desea ejercer y adjuntando copia de su DNI o documento identificativo.
              </p>
              <p className="mt-2">
                Tiene derecho a presentar una reclamación ante la{' '}
                <strong>Agencia Española de Protección de Datos (AEPD)</strong> si considera que el tratamiento de sus datos
                no se ajusta a la normativa vigente:{' '}
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#C9A227] hover:underline">www.aepd.es</a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Seguridad de los datos</h2>
              <p>
                La Comunidad de Propietarios Parcela 8 ha adoptado las medidas técnicas y organizativas necesarias para
                garantizar la seguridad de sus datos personales y evitar su alteración, pérdida, tratamiento o acceso no
                autorizado, habida cuenta del estado de la tecnología, la naturaleza de los datos almacenados y los riesgos
                a los que están expuestos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Transferencias internacionales</h2>
              <p>
                Los datos se almacenan en servidores dentro del Espacio Económico Europeo (EEE) o en países con nivel de
                protección equivalente, garantizando el cumplimiento del RGPD.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Modificaciones de la política</h2>
              <p>
                Nos reservamos el derecho a modificar esta política de privacidad para adaptarla a cambios normativos o
                de funcionamiento. Cualquier modificación será comunicada mediante aviso en la aplicación.
              </p>
              <p className="mt-2 text-sm text-gray-500">Última actualización: abril 2026</p>
            </section>

          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Datos protegidos según RGPD · Comunidad Parcela 8
          </p>
        </div>
      </div>
    </div>
  )
}
