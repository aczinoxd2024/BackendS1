export enum AccionBitacora {
  LOGIN = 'Inicio de sesión exitoso',
  LOGOUT = 'Cierre de sesión',
  RECUPERACION_CONTRASENA = 'Cambio de contraseña',
  ACTUALIZACION_CONTRASENA = 'Actualización de contraseña',
  MODIFICACION_USUARIO = 'Modificación de datos de usuario',

  // 👇 NUEVAS ACCIONES PARA TIPO DE MEMBRESÍA
  CREAR_TIPO_MEMBRESIA = 'Creación de tipo de membresía',
  ACTUALIZAR_TIPO_MEMBRESIA = 'Actualización de tipo de membresía',
  ELIMINAR_TIPO_MEMBRESIA = 'Eliminación de tipo de membresía',
  RESTAURAR_TIPO_MEMBRESIA = 'restaurar_tipo_membresia',


  // Rutinas
  SUSPENDER = 'SUSPENDER',
  REACTIVAR = 'REACTIVAR',
  CREAR_RUTINA = 'Crear Rutina de Entrenamiento',
  ACTUALIZAR_RUTINA = 'Actualizar Rutina de Entrenamiento',
  ELIMINAR_RUTINA = 'Eliminar rutina de Entrenamiento',
  REACTIVAR_RUTINA = 'Reactivar rutina de Entrenamiento',
  CREAR_DETALLE_RUTINA = 'Agregar ejercicio a rutina',
  ELIMINAR_DETALLE_RUTINA = 'Eliminar ejercicio de rutina',
  ASIGNAR_RUTINA_CLASE = 'ASIGNAR_RUTINA_CLASE',
  ASIGNAR_RUTINA_PERSONALIZADA = 'ASIGNAR_RUTINA_PERSONALIZADA',

  // Inventario
  CREAR_INVENTARIO = 'Registro de nuevo ítem de inventario',
  ACTUALIZAR_INVENTARIO = 'Actualización de ítem de inventario',
  DAR_BAJA_INVENTARIO = 'Baja lógica de ítem de inventario',
  LISTAR_INVENTARIO = 'Listado de ítems de inventario',

  CREAR_PERSONAL = 'Creación de personal',
  DESCARGAR_COMPROBANTE = 'Descarga de comprobante de pago',
}
