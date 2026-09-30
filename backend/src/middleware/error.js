export const notFound=(req,res)=>res.status(404).json({message:'Endpoint not found'});
export const errorHandler=(err,req,res,next)=>{console.error(err); res.status(err.status||500).json({message:err.message||'Internal server error'});};
