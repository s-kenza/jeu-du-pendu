const CustomInputComponent = ({ field, form: { touched, errors }, label, type = 'text', ...props }) => (
  <div className="mb-5">
    <label className="font-semibold text-sm pb-1 block" htmlFor={props.id || props.name}>
      {label}
    </label>
    <input
      type={type}
      {...field}
      {...props}
      className={`input input-bordered px-3 py-2 mt-1 text-sm w-full ${touched[field.name] && errors[field.name] ? 'border-red-500' : ''}`}
    />
    {touched[field.name] && errors[field.name] && (
      <div className="text-red-500 text-xs mt-1">{errors[field.name]}</div>
    )}
  </div>
);

export default CustomInputComponent;
